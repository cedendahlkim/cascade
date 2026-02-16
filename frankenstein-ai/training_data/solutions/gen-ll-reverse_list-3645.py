# Task: gen-ll-reverse_list-3645 | Score: 100% | 2026-02-15T09:51:10.787473

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))