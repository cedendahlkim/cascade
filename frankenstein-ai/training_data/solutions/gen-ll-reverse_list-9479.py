# Task: gen-ll-reverse_list-9479 | Score: 100% | 2026-02-14T12:04:43.812561

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))