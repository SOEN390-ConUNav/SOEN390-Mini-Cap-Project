package com.soen390.backend.controller;

import com.soen390.backend.service.PlacesOfInterestService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SearchPlacesController.class)
public class SearchPlacesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PlacesOfInterestService placesOfInterestService;

    @Test
    void searchPlaces_ShouldReturn400ForEmptyQuery() throws Exception {
        mockMvc.perform(get("/api/places/search")
                        .param("query", " "))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("{\"error\":\"Query must not be empty\"}"));
    }

    @Test
    void searchPlaces_ShouldReturn200AndJson() throws Exception {
        String fakeJson = """
            {
                "places": [
                    {
                        "displayName": { "text": "Some Place" },
                        "formattedAddress": "123 Test St",
                        "location": { "latitude": 1, "longitude": 2 }
                    }
                ]
            }
            """;

        when(placesOfInterestService.searchPlacesByText("pizza")).thenReturn(fakeJson);

        mockMvc.perform(get("/api/places/search")
                        .param("query", "pizza"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(content().string(fakeJson));
    }
}
