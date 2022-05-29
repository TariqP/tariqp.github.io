class Api {

    #phoneObject = {
        'value': '',
        'selector': '',
        'label': '',
        'error': false,
        'country_code': ''
    };
    #emailObject = {
        'value': '',
        'selector': '',
        'label': '',
        'error': false
    };
    #initialized = false;

    constructor(api_key, api_url, api_coverage) {
        this.api_key = api_key;
        this.api_url = api_url;
        this.api_coverage = api_coverage;

        this.host = location.host;

        if (this.host.indexOf('www.') === 0)
            this.host = this.host.replace('www.', '');

    }

    sendApiRequest(parameters, callback) {
        this.createHttpRequest(this.api_url, 'GET', parameters).then((httpRequest) => {
            const responseCode = httpRequest.responseCode
            const response = httpRequest.response

            if (responseCode !== 200) {
                this.#phoneObject.error = false
                this.#emailObject.error = false
            }
            if (responseCode === 200) {
                if (this.api_coverage === 'email' || this.api_coverage === 'both') {
                    if (response.email)
                        this.handleFieldResponse(this.#emailObject, response.email)
                    else
                        this.#emailObject.error = false
                }
                if (this.api_coverage === 'phone' || this.api_coverage === 'both') {
                    if (response.phone)
                        this.handleFieldResponse(this.#phoneObject, response.phone)
                    else
                        this.#phoneObject.error = false
                }
            }
            if (this.#emailObject.error === false && this.#phoneObject.error === false && callback != null) {
                callback()
            }
        });
    }

    async createHttpRequest(url, method, parameters) {

        const targetParams = new URLSearchParams();
        for (const key in parameters) {
            targetParams.set(key, parameters[key]);
        }

        let response = await fetch(`${url}?${targetParams.toString()}`);
        let responseCode = response.status;
        response = await response.json();

        return {response: response, responseCode: responseCode};
    }

    createLabel = (labelField, labelId) => {
        const label = document.createElement('label');
        label.id = labelId;
        label.style.cssText = "color:red;width:100%;display:none;";
        labelField.parentNode.insertBefore(label, labelField.nextSibling);
        return label
    }
    initializeField = (field, selector, name) => {

        field.selector = document.querySelector(selector)
        if (!field.selector)
            return;

        field.error = true;
        field.label = this.createLabel(field.selector, name + '_error_verify')

        field.selector.addEventListener('change', () => {
            field.error = true;
            field.value = field.selector.value;
        });

        return field;
    }

    handleFieldResponse = (fieldObject, fieldResponse) => {
        if (fieldResponse.status === "invalid") {
            fieldObject.label.innerHTML = fieldResponse.message;
            fieldObject.label.style.display = "block";
            fieldObject.error = true;
        } else {
            fieldObject.label.style.display = "none";
            fieldObject.error = false;
        }
    }

    createClickSubmitEvents(email, phone, handler, type = 1, action = 'click') {

        if (handler) {
            const handlerSelector = document.querySelector(handler)
            handlerSelector.addEventListener(action, (e) => {
                if (this.#emailObject.error === false && this.#phoneObject.error === false) return;
                if (e) e.preventDefault();

                function dispatch() {
                    handlerSelector.dispatchEvent(new Event(action))
                }

                this.sendApiRequest({
                    'email': this.#emailObject.value,
                    'phone_number': this.#phoneObject.country_code + this.#phoneObject.value,
                    'api_key': this.api_key,
                    'host': this.host,
                    'type': type
                }, dispatch);

            });
        }
    }

    createChangeBlurEvents(email, phone, button, type, action) {
        //Button Field exits
        let canSubmitButton = false;

        const buttonSelector = document.querySelector(button)
        if (!buttonSelector) {
            console.log("AUTHENTICITY LEADS: BUTTON SELECTOR DOES NOT EXIST")
            return;
        }

        const submitLeadRequest = () => {
            this.createHttpRequest(this.api_url, 'GET', {
                'event_type': 'create_lead',
                'api_key': this.api_key,
                'url': this.host
            }).then(() => {
                canSubmitButton = true;
                buttonSelector.dispatchEvent(new Event('click'))
            })
        }

        buttonSelector.addEventListener('click', (e) => {
            if (e && !canSubmitButton) e.preventDefault()
            if (!canSubmitButton) submitLeadRequest();
        });
        const toggleButtonDisabled = () => {
            if (this.#phoneObject.error === false && this.#emailObject.error === false)
                buttonSelector.removeAttribute('disabled')
            else
                buttonSelector.setAttribute('disabled', 'disabled')
        }

        toggleButtonDisabled()


        //Email Field & Selector Exists
        if (email && this.#emailObject.selector) {
            this.#emailObject.selector.addEventListener(action, async (e) => {
                this.sendApiRequest({
                    'email': this.#emailObject.value,
                    'api_key': this.api_key,
                    'host': this.host,
                    'type': type
                }, toggleButtonDisabled)

                toggleButtonDisabled()
            });
        }

        if (phone && this.#phoneObject.selector) {
            this.#phoneObject.selector.addEventListener(action, async () => {
                this.sendApiRequest({
                    'phone_number': this.#phoneObject.country_code + this.#phoneObject.value,
                    'api_key': this.api_key,
                    'host': this.host,
                    'type': type
                })

                toggleButtonDisabled()
            });
        }
    }

    init(type, fields) {
        if (this.#initialized)
            return;

        this.#initialized = true

        if (fields.email)
            this.#emailObject = this.initializeField(this.#emailObject, fields.email, 'email')

        if (fields.phone)
            this.#phoneObject = this.initializeField(this.#phoneObject, fields.phone, 'phone')

        if (this.#phoneObject.selector) {
            this.#phoneObject.country_code = fields.country_code ? fields.country_code : '';
        }
        switch (type) {
            case "change":
            case "blur":
                this.createChangeBlurEvents(fields.email, fields.phone, fields.button, type === 'change' ? 3 : 4, type)
                break;
            case "click":
            case "submit":
                this.createClickSubmitEvents(fields.email, fields.phone, type === 'click' ? fields.button : fields.form, type === 'click' ? 1 : 2, type)
                break;
            default:
                console.log("AUTHENTICITY: UNHANDLED TYPE")
        }
    }

}

export default Api
