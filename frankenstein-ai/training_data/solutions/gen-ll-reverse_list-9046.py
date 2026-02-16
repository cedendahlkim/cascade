# Task: gen-ll-reverse_list-9046 | Score: 100% | 2026-02-15T11:12:55.350558

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))