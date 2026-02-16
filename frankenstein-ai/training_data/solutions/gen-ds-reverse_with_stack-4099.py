# Task: gen-ds-reverse_with_stack-4099 | Score: 100% | 2026-02-15T12:29:18.144036

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))