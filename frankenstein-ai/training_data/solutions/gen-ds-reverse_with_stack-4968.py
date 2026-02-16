# Task: gen-ds-reverse_with_stack-4968 | Score: 100% | 2026-02-15T09:01:21.908733

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))