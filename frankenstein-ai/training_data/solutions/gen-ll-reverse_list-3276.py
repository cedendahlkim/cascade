# Task: gen-ll-reverse_list-3276 | Score: 100% | 2026-02-13T15:46:18.402351

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))