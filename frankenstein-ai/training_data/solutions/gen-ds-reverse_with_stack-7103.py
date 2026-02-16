# Task: gen-ds-reverse_with_stack-7103 | Score: 100% | 2026-02-15T10:09:48.529888

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))