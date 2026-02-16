# Task: gen-ll-reverse_list-8126 | Score: 100% | 2026-02-15T07:52:45.239099

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))