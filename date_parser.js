module.exports = {
    parse_date: function (db_date) {
        try {
            if (new Date(parseInt(db_date)).getDate() < 10)
                z = "0" + new Date(parseInt(db_date)).getDate()
            else
                z = new Date(parseInt(db_date)).getDate()

            if (new Date(parseInt(db_date)).getMonth() + 1 < 10)
                y = "/0" + (new Date(parseInt(db_date)).getMonth() + 1)
            else
                y = "/" + (new Date(parseInt(db_date)).getMonth() + 1)
            x = "/" + new Date(parseInt(db_date)).getFullYear() + " " + new Date(parseInt(db_date)).getHours() + ":"
            if (new Date(parseInt(db_date)).getMinutes() > 10)
                w = new Date(parseInt(db_date)).getMinutes()
            else
                w = "0" + new Date(parseInt(db_date)).getMinutes()

            date_string = z + y + x + w;
            return date_string;

        } catch (err) {
            console.log(err);
            return err;
        }
    }
}