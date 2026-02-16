# Task: gen-ll-reverse_list-8568 | Score: 100% | 2026-02-15T13:00:55.663892

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))