# Task: gen-ll-reverse_list-9050 | Score: 100% | 2026-02-15T09:34:18.660147

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))