# Task: gen-ll-reverse_list-7512 | Score: 100% | 2026-02-13T15:46:43.814736

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))