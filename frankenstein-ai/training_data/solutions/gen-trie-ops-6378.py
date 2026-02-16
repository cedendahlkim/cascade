# Task: gen-trie-ops-6378 | Score: 100% | 2026-02-11T12:17:01.958523

def solve():
    n = int(input())
    trie = {}

    def insert(word):
        node = trie
        for char in word:
            if char not in node:
                node[char] = {}
            node = node[char]
        node['#'] = True

    def search(word):
        node = trie
        for char in word:
            if char not in node:
                return False
            node = node[char]
        return '#' in node

    def prefix_count(prefix):
        node = trie
        for char in prefix:
            if char not in node:
                return 0
            node = node[char]

        count = 0
        def dfs(node):
            nonlocal count
            if '#' in node:
                count += 1
            for char in node:
                if char != '#':
                    dfs(node[char])

        dfs(node)
        return count

    for _ in range(n):
        line = input().split()
        op = line[0]
        arg = line[1]

        if op == 'INSERT':
            insert(arg)
        elif op == 'SEARCH':
            print('true' if search(arg) else 'false')
        elif op == 'PREFIX':
            print(prefix_count(arg))

solve()