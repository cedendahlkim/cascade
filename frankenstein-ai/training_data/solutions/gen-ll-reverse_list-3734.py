# Task: gen-ll-reverse_list-3734 | Score: 100% | 2026-02-13T20:01:50.855261

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))