package com.smartdairy.security;

import com.smartdairy.entity.Farmer;
import java.util.Collection;
import java.util.Collections;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class FarmerUserDetails implements UserDetails {

    private final Farmer farmer;

    public FarmerUserDetails(Farmer farmer) {
        this.farmer = farmer;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_FARMER"));
    }

    @Override
    public String getPassword() {
        return farmer.getPassword();
    }

    @Override
    public String getUsername() {
        return farmer.getMobileNumber();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return farmer.getActive();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return farmer.getActive();
    }

    public Farmer getFarmer() {
        return farmer;
    }

    public Long getFarmerId() {
        return farmer.getId();
    }

    public Long getAdminId() {
        return farmer.getAdmin().getId();
    }
}
