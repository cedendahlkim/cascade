# Task: gen-ll-reverse_list-1579 | Score: 100% | 2026-02-13T20:33:01.231031

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))