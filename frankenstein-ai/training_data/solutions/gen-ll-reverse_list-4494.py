# Task: gen-ll-reverse_list-4494 | Score: 100% | 2026-02-13T15:47:14.928628

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))