
import * as faComps from '@philly/vue-comps/src/fa.js';
import * as faMapping from '@philly/vue-mapping/src/fa.js';

// Font Awesome Icons
import { library } from '@fortawesome/fontawesome-svg-core'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons/faCheckSquare';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faSquare } from '@fortawesome/free-solid-svg-icons/faSquare';
library.add(faInfoCircle, faCheckSquare, faFilter, faSquare);

export default library;
