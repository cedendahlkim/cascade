# Task: gen-ll-reverse_list-9365 | Score: 100% | 2026-02-15T08:24:48.878721

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))