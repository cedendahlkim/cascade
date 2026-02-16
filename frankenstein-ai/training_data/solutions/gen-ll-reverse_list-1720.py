# Task: gen-ll-reverse_list-1720 | Score: 100% | 2026-02-13T17:36:21.844784

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))