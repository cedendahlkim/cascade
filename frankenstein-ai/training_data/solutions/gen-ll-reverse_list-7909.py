# Task: gen-ll-reverse_list-7909 | Score: 100% | 2026-02-15T10:50:26.389803

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))