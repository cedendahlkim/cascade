# Task: gen-ll-reverse_list-2648 | Score: 100% | 2026-02-15T10:50:30.210540

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))