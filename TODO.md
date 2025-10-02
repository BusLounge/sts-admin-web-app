# TODO: Passenger Management Add Passenger Modal and UI Improvements

## Tasks
- [ ] Test the Add Passenger modal popup and form submission in passenger-management page
- [ ] Verify background blur effect when modal is open
- [ ] Confirm form validation and passenger addition functionality
- [ ] Test modal close behavior on cancel and outside click
- [ ] Test overall UI consistency and responsiveness of passenger-management page

## Completed
- [x] Implemented Add Passenger modal popup with form in passenger-management.component.html and .ts
- [x] Added styles for modal popup and background blur similar to add driver form
- [x] Fixed missing newPassenger property and added savePassenger method in component.ts
- [x] Added modal CSS styles to passenger-management.component.scss

## Next Steps
- Perform thorough testing of the passenger management page including the new modal
- Address any bugs or UX issues found during testing
- Confirm with user if further enhancements or fixes are needed

---

# TODO: Dashboard Bus Management Pie Chart Fix

## Tasks
- [x] Analyze current Bus Management chart (displays two separate circles)
- [x] Update TypeScript to add getBusPieBackground() method
- [x] Update HTML to use single pie chart with labels beside
- [x] Update SCSS to style the new pie chart and labels
- [ ] Test the updated Bus Management pie chart display
- [ ] Verify percentages and labels are correct
- [ ] Ensure no impact on other charts

## Completed
- [x] Analyzed code and identified issue: two separate circles instead of one pie chart
- [x] Added getBusPieBackground() method in dashboard.component.ts
- [x] Modified HTML for Bus Management to use pie-container with single pie-slice and pie-labels
- [x] Added SCSS styles for .pie-container, .pie-labels, .label, .color-box

## Next Steps
- Run the application and verify the Bus Management chart now shows one pie chart with two slices
- Check that Active and Inactive labels display correctly with counts
- Confirm no regressions in other dashboard charts
