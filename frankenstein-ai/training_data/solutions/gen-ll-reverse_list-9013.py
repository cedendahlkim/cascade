# Task: gen-ll-reverse_list-9013 | Score: 100% | 2026-02-13T14:00:34.560170

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))