# Task: gen-ll-reverse_list-4176 | Score: 100% | 2026-02-15T10:09:06.499753

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))