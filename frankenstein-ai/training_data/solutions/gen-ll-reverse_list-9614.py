# Task: gen-ll-reverse_list-9614 | Score: 100% | 2026-02-15T11:38:01.294728

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))