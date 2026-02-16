# Task: gen-ll-reverse_list-6183 | Score: 100% | 2026-02-15T13:29:51.474256

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))