# Task: gen-ds-reverse_with_stack-3308 | Score: 100% | 2026-02-13T13:53:35.178755

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))