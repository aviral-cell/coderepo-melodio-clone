**Bug Fix: Live Music Concerts - Hard**

Melodio is a music streaming app with a Live Music Concerts feature that lets users browse upcoming concerts, filter by month and city, view concert details, buy tickets, and explore the performing artist's albums and tracks. The concerts page displays upcoming events sorted by date, with a city-based artist discovery section.

At the moment, the concerts feature is extensively broken. The listing page shows concerts in the wrong order, filters don't work, dates and times display incorrectly, and the city-based artist discovery fails. The detail page shows albums and tracks from the wrong artists, ticket counts are wrong, dialogs won't open, and purchased ticket codes display incorrectly.

**Issue Summary**

The concerts listing page has multiple issues. Past concerts still appear in the listing. Concerts are not sorted by date. Date badges show raw ISO strings like "2026-03-15" instead of formatted text like "Mar 15." Times show in 24-hour format like "19:30" instead of "7:30 PM." The month filter dropdown is missing an "All" option, and selecting a month has no effect because the selection is ignored. Clicking a city chip also has no effect because the city selection is reset immediately.

On the concert detail page, the albums and tracks sections show content from all artists instead of just the performing artist. The ticket count always shows zero regardless of purchases. The "Buy Tickets" and "View My Tickets" buttons do nothing because the dialogs never open. When purchasing tickets, the quantity selector is ignored and only 1 ticket is ever purchased. Ticket cards display timestamps instead of actual ticket codes.

**Steps to Reproduce**

* Log in using test credentials:
  * Email: alex.morgan@melodio.com
  * Password: password123
* Navigate to the Concerts page from the sidebar.
* Observe that past concerts still appear and concerts are not sorted by date.
* Observe that date badges and times are displayed in raw, unformatted text.
* Try selecting a month or city filter — observe that the selection resets immediately.
* Navigate to a concert detail page.
* Observe that albums and tracks from all artists appear, not just the concert artist's.
* Click "Buy Tickets" — observe the dialog does not open.
* If tickets exist, click "View My Tickets" — observe the dialog does not open.

**Expected Behavior**

* Only upcoming concerts should be displayed, sorted by date descending (furthest future first).
* Date badges should show "Mon Day" format (e.g., "Mar 15"). Times should show 12-hour format (e.g., "7:30 PM").
* The month dropdown should include an "All" option. Selecting a month should filter concerts to that month.
* Clicking a city chip should filter the artist discovery section to show artists performing in that city.
* On the detail page, only the concert artist's albums and tracks should appear.
* The "Buy Tickets" dialog should open when clicked, and the quantity selector should work correctly.
* The ticket count should reflect the total tickets purchased. Ticket cards should show actual codes like "CONC-00c1-abc123."
* The "View My Tickets" dialog should open when clicked.

**Note:** Make sure to review the technical-specs/LiveMusicConcerts.md file carefully to understand all the specifications and expected behavior.
