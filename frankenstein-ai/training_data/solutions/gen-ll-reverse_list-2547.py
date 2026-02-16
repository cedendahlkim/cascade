# Task: gen-ll-reverse_list-2547 | Score: 100% | 2026-02-14T13:12:34.348123

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))