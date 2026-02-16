# Task: gen-ll-reverse_list-9458 | Score: 100% | 2026-02-15T13:59:24.987771

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))