# Task: gen-ll-reverse_list-1525 | Score: 100% | 2026-02-13T11:45:33.992919

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))