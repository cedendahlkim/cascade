# Task: gen-ll-reverse_list-3330 | Score: 100% | 2026-02-13T16:27:51.079724

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))