
import * as faComps from '@philly/vue-comps/src/fa.js';
import * as faMapping from '@philly/vue-mapping/src/fa.js';

// Font Awesome Icons
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons/faCheckSquare';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faSquare } from '@fortawesome/free-regular-svg-icons/faSquare';
import { faCircle } from '@fortawesome/free-regular-svg-icons/faCircle';
library.add(faSpinner, faInfoCircle, faCheckSquare, faFilter, faSquare, faCircle);

export default library;
