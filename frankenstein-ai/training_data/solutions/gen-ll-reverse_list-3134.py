# Task: gen-ll-reverse_list-3134 | Score: 100% | 2026-02-15T13:31:01.200182

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))