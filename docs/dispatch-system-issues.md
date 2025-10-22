1. Tost messages for assignment workflow are shown in the top right corner generally. They do not contain any information to identify for which incident or assignment the toast is shown. Need a solution to this.

2. Vehicle are made to update every 15 seconds. Can this be made real-time, given that location is retrieved from mobile app from the crew leader and then saved to vehicle schema and then showed in the map.

3. The mobile app shows iOS's inbuilt popups and input fields. These needs to be changed for app specific ones that matches our themes and colors. They need to be professional too. The assignment notification modal also needs some professionlism.

4. An error is shown when running the mobile app. A version mismatch. But the app runs correctly.

5. Modal popups of assignment confirmation of the web side have icons which are not professional.

6. The button to change the readiness during an assignment is not clickable during an assignment, which is correct. But, this can be enhanced by making it clickable ans showing an warning indicating that it is not possible and contact the dispatch center directly through call for any unavoidable situation. Need to come up with a professional message.

7. Please consider the following scenarios.
   The dispatcher sends an assignment and is still pending for the confirmation from the crew leader, which is 30 second time window and the assignment notification modal is shown in the mobile app. Now the dispatcher cancel the assignment before any response from the crew leader and within this 30 seconds. The notification modal keep showing in the mobile app and the timer runs until ends and steps for timeout are carried out. This is incorrect. A proper solution is needed. But the dispatcher should be able to cancel assignments during this pending stage too.

8. The popups that appears when updating statuses from the mobile are late. The statuses are updated in the mobile app dashbaord before the popup appears. Rather than this popup it would be better if we ask for confirmation, so there will no accidental status updates. If confirmed or rejected no other popups needs to be shown. This way, earlier late popus wont be an issue.

9. In vehicle cards of the web app side, returning time is also shown. This is unneccassary because returning time is same as completion time. Returned time should be kept as it is.

10. All the vehicle cards in the web app side reloads when a status get updated. Can this be made granular, so only the relavent card gets updated. Like the vehicle cards becomes clickable and unclickable when the crew leader updates the readiness from the mobile app. Please check this implementation to use the same for other updates.

11. If the crew leader accepts the assignment within the last two seconds, both the acceptance confirmation and time out messages are shown both in the mobile app and web app. I can't remember the order which the messages appear. But Correcly the assignment is accepted, and workflow can be continued.

12. Need to check mechanism on how the distance from the vehicle to incidents are calculated. Does it use haversine formula? If so do each 4 types vehicles have different speeds? should this be made to use real time data like traffic and whether data? If so, what frequency should be used? Or should we just use haversine formula to simplify things.

13. The map component and the resource bar needs many modifications and fixes. I will tell the specific ones later.

14. 1. Update the vehicle map marker small window to show leader of the vehcile when selected on the map.

15. ✅ **FIXED** - Location permission error on mobile app. (October 21, 2025)

- **Issue**: Error about NSLocation\*UsageDescription keys missing in Info.plist
- **Fix**: Wrapped background permission request in try-catch to handle Expo Go limitations
- **Solution**: Foreground permissions work correctly, background permissions gracefully fail in Expo Go
- **Note**: Background permissions will work in standalone builds with app.json configuration

16. Make users with roles Field crew and citizens not able to log into the web app.

17. After accepting an assignment, the modal shown to inform the leader about the accepatance is shown on top of the assignment notification modal. So, the timer runs in the assignment notification modal behind and runs out too. Then both the timeout modal and acceptance modal are present. I need to click ok on both of these. But correctly the assignment is accepted and worflow can be carried out.

18. When cancelling an active assignment from the dispatcher side, nothing is shown on the mobile app and no warinings. The mobile app dashbaord needs to be refreshed in order see that the assignment is gone.

19. When the assignment timer runs out due to no response, to popup modal are shown and both needs to be pressed ok. This not ideal, showing one is enough. But I believe those two are tied to two different functions. So these should not be lost.

20. Logo is not showing in login screen of the mobile app

21. When an incident is selected from the incident queue, the incident marker on the map gets higlighted and centered on the view port correctly. After this I need some enhancment as follows. When selecting the resources to an incident, the selected resource to gets highlighted and now both the incident and the resource gets shown within the viewport. The same is true for more than one resource too. As an example if two resources are selected for an incident and all the three markers should be highlighted and shown withing the viewport.

22. For some status changes the vehicle cards reloads twice.

23. A complete top to bottom check of the required vehicle showing and suggested vehicle showing and the mechanism on how the incident's status changes with the status changes of assigned vehicles. I think there is an implementation but not is this is working correctly. Because say an incident requires three resources and only one unit is assigned and completes the assignment, should the incident be completed? Also, how to assign more resources for an incident later if needed. Currently further assignments are not possible if the incident is resolved. Or this is not needed at all?

24. The resource bar is set to show the assigned and available number of units, but this is very incosistence. So should we remove this entirely also because the map component is set to show the available and assigned no of units. Since we added readiness this should be also used.

25. ✅ **FIXED** - Map Issue - Vehicle Location Not Resetting (October 22, 2025)

- **Issue**: When crew clicked "Returned to Station" button, vehicle marker stayed at GPS location instead of snapping back to station coordinates.
- **Fix**: Added location reset logic in `assignmentController.js`
  - Line 530-543: When status = "returned", populate home station and reset `currentLocation` to station coordinates
  - Line 547-565: When status = "cancelled" after being in field, also reset location to station
  - Updates `lastLocationUpdate` timestamp for WebSocket sync
- **Result**: Vehicle markers now automatically snap to station position when crew returns or assignment is cancelled after deployment

26. ✅ **FIXED** - Map Issue - Vehicle Marker Color Incorrect (October 22, 2025)

- **Issue**: Vehicle markers showed RED color even when status = `available` (should show GREEN). Color logic prioritized `operational` status (maintenance) over `currentStatus` (available).
- **Fix**: Redesigned color system in `vehicleUtils.ts`
  - Lines 100-170: `getVehicleStatusColors()` now checks `currentStatus` FIRST
  - `currentStatus` determines marker color (Green/Yellow/Orange/Red/Blue)
  - `operational === "maintenance"` adds diagonal stripe pattern overlay (6px width, 50% opacity)
- **Additional Fixes**:
  - Backend validation added (assignmentController.js lines 138-167) - prevents assigning maintenance/not-ready vehicles
  - Resource bar updated (ResourceSelectionBar.tsx) - shows maintenance vehicles grayed out with orange "🛠️ Maintenance" badge, not selectable
  - Out-of-service vehicles filtered completely from all views
- **Result**: Clear visual system - color represents workflow position, stripes represent maintenance status

27. Resource algorithm for required and suggestions?