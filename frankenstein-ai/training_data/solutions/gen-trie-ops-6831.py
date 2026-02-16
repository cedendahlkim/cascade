# Task: gen-trie-ops-6831 | Score: 100% | 2026-02-14T13:41:32.273774

n = int(input())
trie = {}
for _ in range(n):
    parts = input().split()
    op = parts[0]
    word = parts[1]
    if op == 'INSERT':
        node = trie
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True
    elif op == 'SEARCH':
        node = trie
        found = True
        for ch in word:
            if ch not in node:
                found = False
                break
            node = node[ch]
        print('true' if found and '$' in node else 'false')
    elif op == 'PREFIX':
        node = trie
        valid = True
        for ch in word:
            if ch not in node:
                valid = False
                break
            node = node[ch]
        if not valid:
            print(0)
        else:
            def count_words(n):
                c = 1 if '$' in n else 0
                for k, v in n.items():
                    if k != '$':
                        c += count_words(v)
                return c
            print(count_words(node))