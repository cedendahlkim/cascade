# Task: gen-ll-reverse_list-2873 | Score: 100% | 2026-02-15T09:17:09.806288

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))