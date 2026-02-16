# Task: gen-ll-reverse_list-7368 | Score: 100% | 2026-02-15T11:38:02.092884

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))