# Task: gen-ll-reverse_list-3372 | Score: 100% | 2026-02-13T19:24:10.784741

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))