package com.university.repository;

import com.university.model.entity.JobListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface JobListingRepository extends JpaRepository<JobListing, Long> {

    List<JobListing> findByIsActiveTrueOrderByIsFeaturedDescPostedAtDesc();

    @Query("SELECT j FROM JobListing j WHERE j.isActive = true AND (" +
           "LOWER(j.title) LIKE %:term% OR " +
           "LOWER(j.company) LIKE %:term% OR " +
           "LOWER(j.description) LIKE %:term% OR " +
           "LOWER(j.location) LIKE %:term% OR " +
           "LOWER(j.category) LIKE %:term%) " +
           "ORDER BY j.isFeatured DESC, j.postedAt DESC")
    List<JobListing> searchJobs(String term);

    List<JobListing> findByCategoryAndIsActiveTrueOrderByPostedAtDesc(String category);
}
