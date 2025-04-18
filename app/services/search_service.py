import requests

class GoogleIndexChecker:
    def __init__(self):
        pass

    def check_indexed(self, api_key, urls, mode):
        site_queries = [f"site:{url}" if mode == '1' else url for url in urls]

        url = "https://real-time-web-search.p.rapidapi.com/search"

        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "real-time-web-search.p.rapidapi.com",
            "Content-Type": "application/json"
        }

        payload = {
            "queries": site_queries,
            "limit": "1"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            data = response.json()['data']
            check_results = [bool(item['results']) for item in data]
            return dict(zip(urls, check_results))
        except Exception as e:
            return None
        
    def check_indexed_batch(self, api_key, urls, mode):
        def chunks(lst, n):
            for i in range(0, len(lst), n):
                yield lst[i:i + n]

        chunk_size = 95
        all_results = {}
        for url_chunk in chunks(urls, chunk_size):
            result = self.check_indexed(api_key, url_chunk, mode)
            if result:
                all_results.update(result)
            else:
                all_results.update(dict.fromkeys(url_chunk, None))
        
        return all_results
