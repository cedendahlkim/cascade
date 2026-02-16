# Task: gen-ll-reverse_list-7563 | Score: 100% | 2026-02-15T13:30:52.851035

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))