package com.smartdairy.service.impl;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FarmerFinancialAccountServiceImpl implements FarmerFinancialAccountService {

    private final FarmerFinancialAccountRepository accountRepository;
    private final FarmerFinancialTransactionRepository transactionRepository;
    private final FarmerRepository farmerRepository;
    private final UserService userService;

    @Override
    @Transactional
    public FarmerFinancialAccount createAccountForFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        if (accountRepository.existsByAdminAndFarmer(admin, farmer)) {
            throw new IllegalStateException("Financial account already exists for farmer: " + farmerId);
        }

        FarmerFinancialAccount account = FarmerFinancialAccount.builder()
                .admin(admin)
                .farmer(farmer)
                .pendingAdvance(BigDecimal.ZERO)
                .pendingLoan(BigDecimal.ZERO)
                .pendingOther(BigDecimal.ZERO)
                .build();
        return accountRepository.save(account);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerFinancialAccount getAccountByFarmerAndAdmin(Long farmerId) {
        return findAccountOrDefault(farmerId);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerFinancialAccount findAccountOrDefault(Long farmerId) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        return accountRepository.findByAdminAndFarmer(admin, farmer)
                .orElseGet(() -> FarmerFinancialAccount.builder()
                        .admin(admin)
                        .farmer(farmer)
                        .pendingAdvance(BigDecimal.ZERO)
                        .pendingLoan(BigDecimal.ZERO)
                        .pendingOther(BigDecimal.ZERO)
                        .build());
    }

    @Override
    @Transactional
    public FarmerFinancialAccount getOrCreateAccountByFarmer(Long farmerId) {
        return getOrCreateAccount(farmerId);
    }

    @Override
    @Transactional
    public FarmerFinancialAccount addAdvance(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingAdvance();
        BigDecimal newBalance = balanceBefore.add(amount).setScale(2, RoundingMode.HALF_UP);
        account.setPendingAdvance(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.ADVANCE_ADDED,
                amount,
                balanceBefore,
                newBalance,
                "Advance added"
        );

        return account;
    }

    @Override
    @Transactional
    public FarmerFinancialAccount reduceAdvance(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingAdvance();
        BigDecimal newBalance = balanceBefore.subtract(amount).setScale(2, RoundingMode.HALF_UP);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Cannot reduce advance below zero. Current: " + balanceBefore + ", Attempted reduction: " + amount);
        }
        account.setPendingAdvance(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.ADVANCE_RECOVERED,
                amount,
                balanceBefore,
                newBalance,
                "Advance recovered"
        );

        return account;
    }

    @Override
    @Transactional
    public FarmerFinancialAccount addLoan(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingLoan();
        BigDecimal newBalance = balanceBefore.add(amount).setScale(2, RoundingMode.HALF_UP);
        account.setPendingLoan(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.LOAN_ADDED,
                amount,
                balanceBefore,
                newBalance,
                "Loan added"
        );

        return account;
    }

    @Override
    @Transactional
    public FarmerFinancialAccount reduceLoan(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingLoan();
        BigDecimal newBalance = balanceBefore.subtract(amount).setScale(2, RoundingMode.HALF_UP);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Cannot reduce loan below zero. Current: " + balanceBefore + ", Attempted reduction: " + amount);
        }
        account.setPendingLoan(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.LOAN_RECOVERED,
                amount,
                balanceBefore,
                newBalance,
                "Loan recovered"
        );

        return account;
    }

    @Override
    @Transactional
    public FarmerFinancialAccount addOtherDeduction(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingOther();
        BigDecimal newBalance = balanceBefore.add(amount).setScale(2, RoundingMode.HALF_UP);
        account.setPendingOther(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.OTHER_ADDED,
                amount,
                balanceBefore,
                newBalance,
                "Other deduction added"
        );

        return account;
    }

    @Override
    @Transactional
    public FarmerFinancialAccount reduceOtherDeduction(Long farmerId, BigDecimal amount) {
        validateAmount(amount);
        FarmerFinancialAccount account = getOrCreateAccount(farmerId);
        BigDecimal balanceBefore = account.getPendingOther();
        BigDecimal newBalance = balanceBefore.subtract(amount).setScale(2, RoundingMode.HALF_UP);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Cannot reduce other deduction below zero. Current: " + balanceBefore + ", Attempted reduction: " + amount);
        }
        account.setPendingOther(newBalance);
        accountRepository.save(account);

        createTransaction(
                account,
                account.getFarmer(),
                account.getAdmin(),
                FarmerFinancialTransaction.FinancialTransactionType.OTHER_RECOVERED,
                amount,
                balanceBefore,
                newBalance,
                "Other deduction recovered"
        );

        return account;
    }

    private FarmerFinancialAccount getOrCreateAccount(Long farmerId) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        return accountRepository.findByAdminAndFarmer(admin, farmer)
                .orElseGet(() -> {
                    FarmerFinancialAccount account = FarmerFinancialAccount.builder()
                            .admin(admin)
                            .farmer(farmer)
                            .pendingAdvance(BigDecimal.ZERO)
                            .pendingLoan(BigDecimal.ZERO)
                            .pendingOther(BigDecimal.ZERO)
                            .build();
                    return accountRepository.save(account);
                });
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative: " + amount);
        }
    }

    private void createTransaction(
            FarmerFinancialAccount account,
            Farmer farmer,
            User admin,
            FarmerFinancialTransaction.FinancialTransactionType transactionType,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            String description) {
        FarmerFinancialTransaction transaction = FarmerFinancialTransaction.builder()
                .account(account)
                .farmer(farmer)
                .admin(admin)
                .transactionType(transactionType)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description(description)
                .referenceType(FarmerFinancialTransaction.ReferenceType.SYSTEM)
                .build();
        transactionRepository.save(transaction);
    }
}
