package com.soen390.backend.controller;

import com.soen390.backend.config.RestTemplateConfig;
import com.soen390.backend.service.GoogleOAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GoogleOAuthController.class)
@Import(RestTemplateConfig.class)
public class GoogleOAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoogleOAuthService googleOAuthService;

    @Test
    void testExchangeSuccess() throws Exception {
        when(googleOAuthService.exchangeServerAuthCode("valid-auth-code"))
                .thenReturn("generated-session-id");

        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serverAuthCode\": \"valid-auth-code\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.sessionId").value("generated-session-id"));
    }

    @Test
    void testExchangeMissingServerAuthCodeReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangeNullServerAuthCodeReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serverAuthCode\": null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangeBlankServerAuthCodeReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serverAuthCode\": \"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangeEmptyServerAuthCodeReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serverAuthCode\": \"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangeServiceExceptionReturns401() throws Exception {
        when(googleOAuthService.exchangeServerAuthCode(anyString()))
                .thenThrow(new RuntimeException("Google token exchange failed: invalid_grant"));

        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serverAuthCode\": \"invalid-code\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testExchangeInvalidJsonReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("invalid json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangeEmptyBodyReturns400() throws Exception {
        mockMvc.perform(post("/api/google/oauth/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                .andExpect(status().isBadRequest());
    }
}
