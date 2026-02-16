# Task: gen-ll-reverse_list-1624 | Score: 100% | 2026-02-15T09:17:24.024414

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))