import Authenticity from "./modules/Api.mjs"

const ready = (fn) => {
    if (document.readyState !== 'loading')
        fn()
    else
        document.addEventListener('DOMContentLoaded', fn)
}

const onDocumentReady = () => {
    let authenticity = new Authenticity(
        "olgaPd7swU",
        "https://jrstvridwqdmptait3ic7v4f7u0zubeg.lambda-url.us-east-2.on.aws/",
        "both"
    );
    authenticity.init('onClick', {'country_code': '','email': '#imp_email', 'phone': '#imp_phone', 'form': '#form'});
}
ready(onDocumentReady);
