package com.smartdairy.service.impl;

import com.smartdairy.dto.MarkPaymentPaidRequest;
import com.smartdairy.dto.PaymentDashboardStatsResponse;
import com.smartdairy.dto.PaymentResponse;
import com.smartdairy.dto.PaymentSummaryResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.FeedPurchaseService;
import com.smartdairy.service.PaymentReceiptPdfService;
import com.smartdairy.service.PaymentService;
import com.smartdairy.service.UserService;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final FarmerRepository farmerRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final PaymentReceiptPdfService paymentReceiptPdfService;
    private final FeedPurchaseService feedPurchaseService;
    private final SmsService smsService;
    private final UserService userService;

    @Override
    @Transactional
    public PaymentResponse generateFromMilkCollection(Long milkCollectionId) {
        User admin = userService.getLoggedInUser();
        MilkCollection collection = milkCollectionRepository.findByAdminAndId(admin, milkCollectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Milk collection not found with id: " + milkCollectionId));

        if (paymentRepository.findByAdminAndMilkCollection_Id(admin, milkCollectionId).isPresent()) {
            throw new IllegalArgumentException("Payment already exists for this milk collection");
        }

        Payment payment = Payment.builder()
                .admin(admin)
                .farmer(collection.getFarmer())
                .milkCollection(collection)
                .amount(collection.getTotalAmount())
                .grossAmount(collection.getTotalAmount())
                .feedDeductionAmount(java.math.BigDecimal.ZERO.setScale(2))
                .status(PaymentStatus.PENDING)
                .build();
        payment = paymentRepository.save(payment);

        java.math.BigDecimal deducted = feedPurchaseService.applyOutstandingDeductionForPayment(
                collection.getFarmer().getId(), collection.getTotalAmount(), payment.getId());
        payment.setFeedDeductionAmount(deducted);
        payment.setAmount(collection.getTotalAmount().subtract(deducted).setScale(2, java.math.RoundingMode.HALF_UP));
        payment = paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse markPaid(Long paymentId, MarkPaymentPaidRequest request) {
        User admin = userService.getLoggedInUser();
        Payment payment = findPaymentForAdmin(paymentId, admin);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending payments can be marked as paid");
        }
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setRemarks(request.getRemarks());
        payment = paymentRepository.save(payment);
        try {
            smsService.sendSms(
                    payment.getFarmer().getMobileNumber(),
                    "Dear " + payment.getFarmer().getFullName()
                            + "\nPayment Successful"
                            + "\nAmount: Rs." + payment.getAmount()
                            + "\nMethod: " + payment.getPaymentMethod()
                            + "\nStatus: " + payment.getStatus()
                            + "\nDate: " + payment.getPaymentDate()
                            + "\nThank you for using Smart Dairy.");
        } catch (Exception e) {
            System.out.println("Payment sms failed " + e.getMessage());
        }
        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> listPending() {
        User admin = userService.getLoggedInUser();
        return paymentRepository.findByAdminAndStatus(admin, PaymentStatus.PENDING).stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> listByFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        findFarmerForAdmin(farmerId, admin);
        return paymentRepository.findByAdminAndFarmer_IdOrderByCreatedAtDesc(admin, farmerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> listAll(PaymentStatus status) {
        User admin = userService.getLoggedInUser();
        List<Payment> payments = status == null
                ? paymentRepository.findByAdmin(admin)
                : paymentRepository.findByAdminAndStatus(admin, status);

        return payments.stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSummaryResponse weeklySummary(LocalDate weekStart, LocalDate weekEnd) {
        User admin = userService.getLoggedInUser();
        return PaymentSummaryResponse.builder()
                .periodLabel(weekStart + " to " + weekEnd)
                .paymentCount(paymentRepository.countByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, weekStart, weekEnd))
                .totalAmount(paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, weekStart, weekEnd))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSummaryResponse monthlySummary(int year, int month) {
        User admin = userService.getLoggedInUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        return PaymentSummaryResponse.builder()
                .periodLabel(ym.toString())
                .paymentCount(paymentRepository.countByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, start, end))
                .totalAmount(paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, start, end))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDashboardStatsResponse dashboardStats() {
        User admin = userService.getLoggedInUser();

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);
        YearMonth ym = YearMonth.from(today);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();

        return PaymentDashboardStatsResponse.builder()
                .pendingCount(paymentRepository.countByAdminAndStatus(admin, PaymentStatus.PENDING))
                .pendingTotalAmount(paymentRepository.sumAmountByAdminAndStatus(admin, PaymentStatus.PENDING))
                .paidThisWeekCount(paymentRepository.countByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, weekStart, weekEnd))
                .paidThisWeekTotal(paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, weekStart, weekEnd))
                .paidThisMonthCount(paymentRepository.countByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, monthStart, monthEnd))
                .paidThisMonthTotal(paymentRepository.sumAmountByAdminAndStatusAndPaymentDateBetween(
                        admin, PaymentStatus.PAID, monthStart, monthEnd))
                .feedOutstandingTotal(feedPurchaseRepository.sumOutstandingByAdmin(admin))
                .feedPurchasedThisMonthTotal(feedPurchaseService.summary(monthStart, monthEnd).getTotalAmount())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id) {
        User admin = userService.getLoggedInUser();
        return toResponse(findPaymentForAdmin(id, admin));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateReceiptPdf(Long paymentId) {
        User admin = userService.getLoggedInUser();
        Payment payment = paymentRepository.findByAdminAndIdWithDetails(admin, paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Receipt is available only for paid payments");
        }
        return paymentReceiptPdfService.buildReceipt(payment);
    }

    private Payment findPaymentForAdmin(Long id, User admin) {
        return paymentRepository.findByAdminAndId(admin, id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    private Farmer findFarmerForAdmin(Long farmerId, User admin) {
        return farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .farmerId(p.getFarmer().getId())
                .farmerName(p.getFarmer().getFullName())
                .milkCollectionId(p.getMilkCollection().getId())
                .amount(p.getAmount())
                .grossAmount(p.getGrossAmount())
                .feedDeductionAmount(p.getFeedDeductionAmount())
                .farmerOutstandingFeedBalance(feedPurchaseService.getOutstandingByFarmer(p.getFarmer().getId()))
                .paymentDate(p.getPaymentDate())
                .status(p.getStatus())
                .paymentMethod(p.getPaymentMethod())
                .remarks(p.getRemarks())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
