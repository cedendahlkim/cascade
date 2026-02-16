# Task: gen-ll-reverse_list-2475 | Score: 100% | 2026-02-13T18:23:59.093330

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))