# Task: gen-ds-reverse_with_stack-2082 | Score: 100% | 2026-02-15T10:51:12.259837

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))