# Task: gen-ll-reverse_list-2430 | Score: 100% | 2026-02-15T08:06:01.058855

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))