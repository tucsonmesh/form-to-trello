// https://trello.com/power-ups/XXXXXXXXX/edit/api-key
TRELLO_API_KEY = 'XXXXXXXXXXXXXX';
TRELLO_API_TOKEN = 'XXXXXXXXXXXXXX';

TRELLO_BOARD_ID = 'XXXXXXXXXXXXX';
TRELLO_LIST_ID = 'XXXXXXXXXXX';

// Name is expected to be the title
const card_description_template = `
  # Location
  ## User-submitted Address
  __SUBMITTED_ADDRESS__
  
  ## "Geocoded" Address
  __GEOCODED_ADDRESS__
  __GOOGLE_MAPS_LINK__
  __BCC_DISTANCE__

  #Contact Info
  [__PHONE__](tel://__PHONE__)
  [__EMAIL__](mailto://__EMAIL__)

  #NN
  UNASSIGNED
`;

const BCC_LATLNG = {
  'lat': 32.246205495927924,
  'lng': -110.96978882062176
};

// Stoled
// https://stackoverflow.com/a/27943
function deg2rad(deg) {
  return deg * Math.PI/180;
}
function getDistanceFromLatLonInMi(lat1,lon1,lat2,lon2) {
  const R = 3963; // Radius of the earth in miles
  const dLat = deg2rad(lat2-lat1);  // deg2rad below
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in miles
  return d;
}

// Called on Google Form submission
function onSubmit(evt) {
  const formResp = evt['response'];
  const resps = formResp.getItemResponses();

  let title = '';
  let address = '';
  let desc = card_description_template;
  // If true, a human should manually check that the address chosen is correct
  let check_address = false;

  for (let j = 0; j < resps.length; j++) {
    let itemResponse = resps[j];
    // Logger.log('Form Response\'s answer to the question "%s" was "%s"',
    //     itemResponse.getItem().getTitle(),
    //     itemResponse.getResponse());
    if (itemResponse.getItem().getTitle() == 'Name') {
      title = itemResponse.getResponse();
    } else if (itemResponse.getItem().getTitle() == 'Address') {
      address = itemResponse.getResponse();
    } else if (itemResponse.getItem().getTitle() == 'Phone') {
      desc = desc.replaceAll('__PHONE__', itemResponse.getResponse());
    } else if (itemResponse.getItem().getTitle() == 'Email') {
      desc = desc.replaceAll('__EMAIL__', itemResponse.getResponse());
    } else {
      Logger.log(`Ignoring form submission field '${itemResponse.getItem().getTitle()}`);
    }
  }

  const mapsResp = Maps.newGeocoder()
    // Rough bounds of Tucson from just right clicking SW and NE rough corners in Google Maps
    .setBounds(32.10467904802711, -111.06377776585339, 32.36778249911013, -110.73212800684647)
    .geocode(address);

  if (mapsResp['results'].length > 1) {
    check_address = true;
  }
  const formatted_address = mapsResp['results'][0]['formatted_address'];
  const latlng = mapsResp['results'][0]['geometry']['location'];
  const lat = latlng['lat'];
  const lng = latlng['lng'];

  const address_link = `[See on Google Maps](https://www.google.com/maps/place/${encodeURIComponent(formatted_address)}/@${lat},${lng})`;
  desc = desc.replaceAll('__SUBMITTED_ADDRESS__', address)
  desc = desc.replaceAll('__GEOCODED_ADDRESS__', check_address ? formatted_address : `${formatted_address}\nNote: there were multiple matches. Check against the submitted address above.\n`);
  desc = desc.replaceAll('__GOOGLE_MAPS_LINK__', address_link);

  const bcc_distance = getDistanceFromLatLonInMi(lat, lng, BCC_LATLNG['lat'], BCC_LATLNG['lng']);
  desc = desc.replaceAll('__BCC_DISTANCE__', `This is about ${bcc_distance.toFixed(3)} miles away from the BCC`);

  Logger.log(`Creating a card with name ${title} and description\n${desc}`);
  const url = `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
  const data = {
    'name': title,
    'desc': desc,
    'pos': 'top',
    'idList': TRELLO_LIST_ID,
    'address': address,
    'start': Date.now()
  };
  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };

  const postResp = UrlFetchApp.fetch(url, options);

  Logger.log(`Got response code ${postResp.getResponseCode()}`);
}

/*
 *
 * 
  Helpers to figure out Trello board/board list IDs as well as test various Apps Script APIs
 *
 * 
 */

function getBoards() {
  const url = `https://api.trello.com/1/members/me/boards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
  let options = {
    "method": "get",
    "muteHttpExceptions": false
  };
  
  console.log(`Fetching ${url}`);
  const resp = UrlFetchApp.fetch(url, options);

  console.log(JSON.stringify(resp.getContentText(), null, 2));
}

function getBoardLists() {
  const url = `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
  let options = {
    "method": "get",
    "muteHttpExceptions": false
  };

  Logger.log(`Fetching ${url}`);
  const resp = UrlFetchApp.fetch(url, options);

  Logger.log(JSON.stringify(resp.getContentText(), null, 2));
}

function testGeocoding() {
  let resp = Maps.newGeocoder()
    .setBounds(32.10467904802711, -111.06377776585339, 32.36778249911013, -110.73212800684647)
    .geocode('101 E Ventura St');

  let formatted_address = resp['results'][0]['formatted_address'];
  let latlng = resp['results'][0]['geometry']['location'];

  let lat = latlng['lat'];
  let lng = latlng['lng'];

  Logger.log(`Formatted address '${formatted_address} is at (lat, lng): (${lat}, ${lng})`);
  Logger.log(`Click https://www.google.com/maps/place/${formatted_address}/@${lat},${lng}`);
}

function testDistance() {
  const bcc_distance = getDistanceFromLatLonInMi(32.28386871, -110.6136242, BCC_LATLNG['lat'], BCC_LATLNG['lng']);
  Logger.log(`This is about ${bcc_distance.toFixed(3)} miles away from the BCC`);
}
